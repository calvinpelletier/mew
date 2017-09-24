function formatTime(value) {
  if (value < 1) {
    return Math.round(value * 60) + " seconds";
  } else if (value < 120) {
    return Math.round(value) + " minutes";
  } else {
    return (value / 60).toFixed(1) + " hours";
  }
}