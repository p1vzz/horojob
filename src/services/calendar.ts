import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import { createCalendarService } from './calendarCore';

export * from './calendarCore';

const calendarService = createCalendarService({
  platformOs: Platform.OS,
  getCalendars: () => Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT),
  getCalendarPermissions: () => Calendar.getCalendarPermissionsAsync(),
  requestCalendarPermissions: () => Calendar.requestCalendarPermissionsAsync(),
  getDefaultCalendar:
    Platform.OS === 'ios'
      ? async () => {
          return Calendar.getDefaultCalendarAsync();
        }
      : undefined,
  getEvents: (calendarIds, startAt, endAt) => Calendar.getEventsAsync(calendarIds, startAt, endAt),
  getEvent: (eventId) => Calendar.getEventAsync(eventId),
  updateEvent: (eventId, payload) => Calendar.updateEventAsync(eventId, payload),
  createEvent: (calendarId, payload) => Calendar.createEventAsync(calendarId, payload),
});

export const listWritableCalendarOptions = calendarService.listWritableCalendarOptions;
export const getCalendarPermissionState = calendarService.getCalendarPermissionState;
export const requestCalendarPermission = calendarService.requestCalendarPermission;
export const resolvePreferredCalendarId = calendarService.resolvePreferredCalendarId;
export const loadCalendarBusyIntervals = calendarService.loadCalendarBusyIntervals;
export const syncInterviewStrategyCalendarEvents = calendarService.syncInterviewStrategyCalendarEvents;
