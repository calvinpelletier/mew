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
    select = 'SELECT task, unixdate, category, completed, ROWID FROM tasks WHERE uid = ? AND ({})'.format(
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
            'completed': task[3],
            'task_id': task[4]
        })

    cur_dow = datetime.datetime.now(pytz.timezone(tz)).date().isoweekday() % 7

    return ret, cur_dow


def get_task_categories(db, uid, tz):
    c = db.cursor()
    c.execute('SELECT ROWID, name, column, row, color FROM task_categories WHERE uid = ?', (uid,))
    categories = c.fetchall()
    c.execute('SELECT ROWID, task, category, unixdate, completed, cleared FROM tasks WHERE uid = ? AND category != -1', (uid,))
    tasks = c.fetchall()
    c.close()

    week_start = get_current_week(tz)
    days = [calendar.timegm((week_start + datetime.timedelta(days=i)).timetuple()) for i in range(7)]

    ret = [] # list of dicts
    cid_to_idx = {} # category id to idx in ret of that category
    for cid, name, column, row, color in categories:
        cid_to_idx[cid] = len(ret)
        ret.append({
            'cid': cid,
            'name': name,
            'color': color,
            'column': column,
            'row': row,
            'tasks': []
        })

    for tid, task, cid, unixdate, completed, cleared in tasks:
        try:
            dow = days.index(unixdate)
        except:
            dow = -1
        ret[cid_to_idx[cid]]['tasks'].append({
            'task_id': tid,
            'task': task,
            'dow': dow,
            'completed': completed,
            'cleared': cleared,
        })

    return ret


def add_category(db, uid, name):
    N_COLUMNS = 4
    CATEGORY_COLORS = [
        '336359',
        'a5f9a2',
        '001b47',
        '58e5f4',
        '561377',
        'f7be99',
        '820f1e',
        'a9b1f9',
        'c44400',
        'f9a9cf',
        '2a5e00',
        'e6ea77',
    ]

    c = db.cursor()
    c.execute('SELECT column, row FROM task_categories WHERE uid = ?', (uid,))
    categories = c.fetchall()
    n_categories = len(categories)
    c.close()

    rows_per_column = [0] * N_COLUMNS
    for col, row in categories:
        if rows_per_column[col] < row:
            rows_per_column[col] = row

    color = CATEGORY_COLORS[n_categories % len(CATEGORY_COLORS)]
    column = n_categories % N_COLUMNS
    row = rows_per_column[column]

    c = db.cursor()
    c.execute('INSERT INTO task_categories VALUES (?,?,?,?,?)', (uid, name, column, row, color))
    cid = c.lastrowid
    db.commit()
    c.close()

    return {'cid': cid, 'column': column, 'color': color}


def add_task_by_dow(db, uid, tz, task, dow):
    if dow == -1:
        unixdate = 0
    else:
        unixdate = calendar.timegm((get_current_week(tz) + datetime.timedelta(days=dow)).timetuple())

    c = db.cursor()
    c.execute('INSERT INTO tasks VALUES (?,?,?,?,?,?)', (uid, task, unixdate, -1, 0, 0))
    task_id = c.lastrowid
    db.commit()
    c.close()
    return task_id


def add_task_by_category(db, uid, task, category):
    c = db.cursor()
    c.execute('INSERT INTO tasks VALUES (?,?,?,?,?,?)', (uid, task, 0, category, 0, 0))
    task_id = c.lastrowid
    db.commit()
    c.close()
    return task_id


def assign_task_to_day(db, uid, task, tz, dow):
    unixdate = calendar.timegm((get_current_week(tz) + datetime.timedelta(days=dow)).timetuple())

    c = db.cursor()
    c.execute('UPDATE tasks SET unixdate = ? WHERE uid = ? AND ROWID = ?', (unixdate, uid, task))
    db.commit()
    c.close()


def remove_task(db, uid, task_id):
    c = db.cursor()
    c.execute('DELETE FROM tasks WHERE uid = ? AND ROWID = ?', (uid, task_id))
    db.commit()
    c.close()


def finish_task(db, uid, tz, task_id):
    unixdate = timezones.cur_unixdate_for_tz(pytz.timezone(tz))
    c = db.cursor()
    c.execute('UPDATE tasks SET completed = ? WHERE uid = ? AND ROWID = ?', (unixdate, uid, task_id))
    db.commit()
    c.close()


def unfinish_task(db, uid, task_id):
    c = db.cursor()
    c.execute('UPDATE tasks SET completed = 0 WHERE uid = ? AND ROWID = ?', (uid, task_id))
    db.commit()
    c.close()


def clear_finished(db, uid):
    c = db.cursor()
    c.execute('UPDATE tasks SET cleared = 1 WHERE uid = ? AND completed != 0 AND category != -1', (uid,))
    db.commit()
    c.close()


def rename_category(db, uid, cid, new_name):
    c = db.cursor()
    c.execute('UPDATE task_categories SET name = ? WHERE uid = ? AND ROWID = ?', (new_name, uid, cid))
    db.commit()
    c.close()
