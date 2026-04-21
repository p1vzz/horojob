import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import { createCalendarService } from './calendarCore';

export * from './calendarCore';

const HOROJOB_CALENDAR_TITLE = 'Horojob';
const HOROJOB_CALENDAR_COLOR = '#C9A84C';

function resolveDeviceTimezoneIana() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

async function createLocalHorojobCalendar(timeZone: string) {
  return Calendar.createCalendarAsync({
    title: HOROJOB_CALENDAR_TITLE,
    name: HOROJOB_CALENDAR_TITLE,
    color: HOROJOB_CALENDAR_COLOR,
    entityType: Calendar.EntityTypes.EVENT,
    source: {
      name: HOROJOB_CALENDAR_TITLE,
      type: Calendar.SourceType.LOCAL,
      isLocalAccount: true,
    },
    ownerAccount: HOROJOB_CALENDAR_TITLE,
    timeZone,
    isVisible: true,
    isSynced: true,
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

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
  createHorojobCalendar: async () => {
    const timeZone = resolveDeviceTimezoneIana();
    if (Platform.OS === 'ios') {
      const defaultCalendar = await Calendar.getDefaultCalendarAsync();
      return Calendar.createCalendarAsync({
        title: HOROJOB_CALENDAR_TITLE,
        color: HOROJOB_CALENDAR_COLOR,
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: defaultCalendar.source?.id,
        source: defaultCalendar.source,
        name: HOROJOB_CALENDAR_TITLE,
      });
    }

    return createLocalHorojobCalendar(timeZone);
  },
  getEvents: (calendarIds, startAt, endAt) => Calendar.getEventsAsync(calendarIds, startAt, endAt),
  getEvent: (eventId) => Calendar.getEventAsync(eventId),
  updateEvent: (eventId, payload) =>
    Calendar.updateEventAsync(eventId, {
      ...payload,
      availability: Calendar.Availability.FREE,
    }),
  createEvent: (calendarId, payload) =>
    Calendar.createEventAsync(calendarId, {
      ...payload,
      availability: Calendar.Availability.FREE,
    }),
  deleteEvent: (eventId) => Calendar.deleteEventAsync(eventId),
});

export const listWritableCalendarOptions = calendarService.listWritableCalendarOptions;
export const getCalendarPermissionState = calendarService.getCalendarPermissionState;
export const requestCalendarPermission = calendarService.requestCalendarPermission;
export const resolvePreferredCalendarId = calendarService.resolvePreferredCalendarId;
export const loadCalendarBusyIntervals = calendarService.loadCalendarBusyIntervals;
export const syncInterviewStrategyCalendarEvents = calendarService.syncInterviewStrategyCalendarEvents;
export const removeInterviewStrategyCalendarEvents = calendarService.removeInterviewStrategyCalendarEvents;
