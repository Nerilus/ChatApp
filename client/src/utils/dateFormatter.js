/**
 * Formate une date de message dans le style Microsoft Teams / Slack
 * Ex: "Aujourd'hui à 14:32", "Hier à 09:15", "22 sept. à 11:00"
 */
export function formatMessageDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Aujourd'hui à ${timeStr}`;
  }
  if (isYesterday) {
    return `Hier à ${timeStr}`;
  }

  // Same year
  const isSameYear = date.getFullYear() === now.getFullYear();
  if (isSameYear) {
    const dayMonth = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return `${dayMonth} à ${timeStr}`;
  }

  // Different year
  const fullDate = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fullDate} à ${timeStr}`;
}

/**
 * Calcule le statut d'activité d'un utilisateur dans le style Microsoft Teams
 * (Disponible, Inactif depuis X min, Absent, Hors ligne)
 */
export function formatUserPresenceStatus(activityInfo, isDirectlyOnline = true) {
  if (!activityInfo && !isDirectlyOnline) {
    return {
      label: 'Hors ligne',
      status: 'offline',
      color: 'var(--text-muted)',
      badgeClass: 'status-offline',
    };
  }

  const status = activityInfo?.status || (isDirectlyOnline ? 'AVAILABLE' : 'OFFLINE');
  const lastActiveDate = activityInfo?.lastActive ? new Date(activityInfo.lastActive) : null;
  const now = new Date();

  // If status is explicitly OFFLINE or not online
  if (status === 'OFFLINE' || !isDirectlyOnline) {
    if (lastActiveDate && !isNaN(lastActiveDate.getTime())) {
      const diffMs = now - lastActiveDate;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMin / 60);

      if (diffMin < 60) {
        return {
          label: `Inactif depuis ${Math.max(1, diffMin)} min`,
          status: 'offline',
          color: 'var(--text-muted)',
          badgeClass: 'status-offline',
        };
      } else if (diffHours < 24) {
        return {
          label: `Inactif depuis ${diffHours}h`,
          status: 'offline',
          color: 'var(--text-muted)',
          badgeClass: 'status-offline',
        };
      }
    }
    return {
      label: 'Hors ligne',
      status: 'offline',
      color: 'var(--text-muted)',
      badgeClass: 'status-offline',
    };
  }

  // If user is currently online, check if inactive (e.g. idle > 5 min)
  if (lastActiveDate && !isNaN(lastActiveDate.getTime())) {
    const diffMs = now - lastActiveDate;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin >= 5 || status === 'AWAY') {
      return {
        label: `Inactif depuis ${diffMin} min`,
        status: 'away',
        color: 'var(--warning)',
        badgeClass: 'status-away',
      };
    }
  }

  return {
    label: 'Disponible',
    status: 'available',
    color: 'var(--success)',
    badgeClass: 'status-available',
  };
}
