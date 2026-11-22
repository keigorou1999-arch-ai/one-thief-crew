// The alarm meter: it fills while the live thief is being noticed and jumps each time a ghost is
// caught. Past half the guards hurry (ALERT); full, the building locks down and the loop is lost.
import { ALARM } from '../config.js';

export const CALM = 'CALM';
export const ALERT = 'ALERT';
export const LOCKDOWN = 'LOCKDOWN';

export function createAlarmMeter() {
  return { level: 0, peak: 0 };
}

export function raiseAlarm(alarm, amount) {
  alarm.level = Math.min(ALARM.max, alarm.level + amount);
  if (alarm.level > alarm.peak) alarm.peak = alarm.level;
}

export function alarmStage(alarm) {
  if (alarm.level >= ALARM.max) return LOCKDOWN;
  return alarm.level >= ALARM.alertAt ? ALERT : CALM;
}

export function alarmIsLockdown(alarm) {
  return alarm.level >= ALARM.max;
}
