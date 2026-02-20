import { Lane } from './types';

export const lanes: Lane[] = [
  {
    id: 'vendors',
    label: 'Vendors / Consultants',
    shortLabel: 'Vendors',
    actors: ['vendors'],
    color: '#FEF3C7', // amber-100
    order: 0,
  },
  {
    id: 'madigan-pm',
    label: 'Madigan Development - Project Managers',
    shortLabel: 'PM',
    actors: ['madigan-pm'],
    color: '#DBEAFE', // blue-100
    order: 1,
  },
  {
    id: 'madigan-dev-exec',
    label: 'Madigan Development - Development Executives',
    shortLabel: 'Dev Exec',
    actors: ['madigan-dev-exec'],
    color: '#E0E7FF', // indigo-100
    order: 2,
  },
  {
    id: 'madigan-exec-approval',
    label: 'Madigan Development - Executive Approval',
    shortLabel: 'Exec Approval',
    actors: ['madigan-exec-approval'],
    color: '#EDE9FE', // violet-100
    order: 3,
  },
  {
    id: 'ownership',
    label: 'Ownership',
    shortLabel: 'Ownership',
    actors: ['ownership'],
    color: '#D1FAE5', // emerald-100
    order: 4,
  },
  {
    id: 'billing-platform',
    label: '3rd Party Billing Platform',
    shortLabel: 'Billing Platform',
    actors: ['billing-platform'],
    color: '#FEE2E2', // red-100
    order: 5,
  },
];

/** Map from ActorId to the lane it belongs to */
export function getLaneForActor(actorId: string): Lane | undefined {
  return lanes.find((lane) => lane.actors.includes(actorId as never));
}
