import { Result } from 'surrealdb.js';
import { getDatabaseInstance } from './db.adapter';
import { CreateEventDto, Event, EventStatus, UpdateEventDto } from '~/types/event';

// function mapToEvent(eventResponse: Event): Event {
//   let createdAt = new Date(eventResponse.createdAt);
//   let lastUpdatedAt = undefined;
//   let dateAndTime = new Date(eventResponse.dateAndTime);
//   let cancelledAt = undefined;

//   if (isNaN(Date.parse(eventResponse.createdAt))) {
//     createdAt = new Date();
//   }
//   if (eventResponse.lastUpdatedAt && !isNaN(Date.parse(eventResponse.lastUpdatedAt))) {
//     lastUpdatedAt = new Date(eventResponse.lastUpdatedAt);
//   }
//   if (isNaN(Date.parse(eventResponse.dateAndTime))) {
//     throw new Error('Invalid dateAndTime');
//   }
//   if (eventResponse.cancelledAt && !isNaN(Date.parse(eventResponse.cancelledAt))) {
//     cancelledAt = new Date(eventResponse.cancelledAt);
//   }

//   return {
//     ...eventResponse,
//     dateAndTime,
//     cancelledAt,
//     createdAt,
//     lastUpdatedAt,
//   }
// }

export async function createEvent({ teacherId, ...dto }: CreateEventDto): Promise<Event | null> {
  const db = await getDatabaseInstance();
  const [event] = await db.query<Result<Event[]>[]>(`create event content {
    dateAndTime: $dateAndTime,
    duration: $duration,
    status: $status,
    createdAt: time::now()
  }`, {...dto, status: EventStatus.ACTIVE });
  if (event.error) {
    throw event.error;
  }

  if (event.result.length > 0) {
    const [relationResponse] = await db.query('relate $teacherId -> schedule -> $eventId', { teacherId, eventId: event.result[0].id });
    if (relationResponse.error) {
      throw relationResponse.error;
    }
    return event.result[0];
  } else {
    return null;
  }
}

export async function updateEventDetails({ eventId, ...updateData }: UpdateEventDto): Promise<Event | null> {
  const db = await getDatabaseInstance();
  const event = await db.change<Event, {}>(eventId, {
    dateAndTime: updateData.dateAndTime,
    duration: updateData.duration,
    status: updateData.status,
    cancelledAt: updateData.status === EventStatus.CANCELLED ? (new Date()).toISOString() : undefined,
    cancellationReason: updateData.status === EventStatus.CANCELLED ? updateData.cancellationReason : undefined
  });
  if (Array.isArray(event)) {
    return null;
  } else {
    return event;
  }
}
