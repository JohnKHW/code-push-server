import moment from 'moment';

export const formatDateTime = (value?: string | number | Date) =>
  value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : '-';

export const fromNow = (value?: string | number | Date) =>
  value ? moment(value).fromNow() : '-';

export const formatDate = (value?: string | number | Date) =>
  value ? moment(value).format('YYYY-MM-DD') : '-';
