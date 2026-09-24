export const formatDateIndo = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  
  return `${day} ${month} ${year}`;
};

export const formatDateTimeIndo = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${day} ${month} ${year} • ${hours}:${minutes}:${seconds} WIB`;
};

export const formatIndonesianDateTime = formatDateTimeIndo;
export const formatIndonesianDate = formatDateIndo;

export const formatDuration = (startDate: Date | string, endDate?: Date | string | null): string => {
  const start = new Date(startDate).getTime();
  const end = endDate ? new Date(endDate).getTime() : Date.now();

  if (isNaN(start) || isNaN(end)) return '-';

  const diffMs = Math.abs(end - start);
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  const remainingHours = totalHours % 24;
  const remainingMinutes = totalMinutes % 60;

  if (days > 0) {
    return `${days} Hari ${remainingHours} Jam`;
  }
  if (totalHours > 0) {
    return `${totalHours} Jam ${remainingMinutes} Menit`;
  }
  return `${totalMinutes} Menit`;
};
