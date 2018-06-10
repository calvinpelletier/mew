from log import *
import datetime
import calendar
import timezones
import time
import pytz

def get_current_week(timezone_name):
    tz_obj = pytz.timezone(timezone_name)
    return timezones.local_current_week(tz_obj, int(time.time()))

# week start is a datetime.date obj or None for current week
def get_tasks_by_week(db, uid, tz, week_start=None):
    if week_start is None:
        week_start = get_current_week(tz)

    days = [calendar.timegm((week_start + datetime.timedelta(days=i)).timetuple()) for i in range(7)]
    select = 'SELECT task, unixdate, category, completed FROM tasks WHERE uid = ? AND ({})'.format(
        ' OR '.join(['unixdate = ?'] * 7)
    )

    c = db.cursor()
    c.execute(select, [uid] + days)
    tasks = c.fetchall()
    c.close()

    ret = []
    for task in tasks:
        dow = days.index(task[1])
        ret.append({
            'task': task[0],
            'dow': dow,
            'category': task[2],
            'completed': task[3]
        })

    cur_dow = datetime.datetime.now(pytz.timezone(tz)).date().isoweekday() % 7

    return ret, cur_dow

def get_task_categories(db, uid):
    c = db.cursor()
    print uid
    c.execute('SELECT ROWID, name FROM task_categories WHERE uid = ?', (uid,))
    categories = c.fetchall()
    c.execute('SELECT task, category, unixdate, completed FROM tasks WHERE uid = ? AND category != -1', (uid,))
    tasks = c.fetchall()
    c.close()

    ret = [] # list of dicts
    cid_to_idx = {} # category id to idx in ret of that category
    for cid, category in categories:
        cid_to_idx[cid] = len(ret)
        ret.append({
            'cid': cid,
            'category': category,
            'tasks': []
        })

    for task, cid, unixdate, completed in tasks:
        ret[cid_to_idx[cid]]['tasks'].append({
            'task': task,
            'unixdate': unixdate,
            'completed': completed
        })

    return ret

def add_task_by_dow(db, uid, tz, task, dow):
    unixdate = calendar.timegm((get_current_week(tz) + datetime.timedelta(days=dow)).timetuple())

    c = db.cursor()
    c.execute('INSERT INTO tasks VALUES (?,?,?,?,?)', (uid, task, unixdate, -1, 0))
    db.commit()
    c.close()
