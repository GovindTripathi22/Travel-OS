import { ConflictAlert, ItineraryItem, User } from '@/types';

/**
 * Scans all itinerary items against each companion's preferences to detect proactive conflicts.
 * Defensively typed to ensure robustness across partial payloads.
 */
export function detectTripConflicts(
  items: ItineraryItem[],
  users: User[]
): ConflictAlert[] {
  const alerts: ConflictAlert[] = [];

  for (const item of items) {
    for (const user of users) {
      const prefs = user.preferences || ({} as any);
      const mobility = prefs.mobility || {};
      const medical = Array.isArray(prefs.medical) ? prefs.medical : [];
      const dietary = Array.isArray(prefs.dietary) ? prefs.dietary : [];

      // 1. Mobility Conflict Check
      const maxWalking = mobility.maxWalkingMeters ?? 500;
      if (item.walkingDistanceMeters && item.walkingDistanceMeters > maxWalking) {
        const medicalReason = medical.length > 0 ? `due to ${medical.join(', ')}` : 'mobility limit';
        alerts.push({
          id: `conflict-mob-walk-${item.id}-${user.id}`,
          type: 'mobility',
          severity: 'critical',
          affectedUserId: user.id,
          eventId: item.id,
          description: `${user.name || 'Traveler'} has a walking limit of ${maxWalking}m (${medicalReason}), but ${item.title} requires ${item.walkingDistanceMeters}m of uphill walking.`,
          suggestedAction: {
            title: 'Book Electric Cart & Wheelchair Ramp Access',
            resolutionType: 'book_assistance',
            details: `Reserve Jaipur Tourism golf cart assistance directly to the inner courtyard so ${user.name || 'traveler'} bypasses the incline.`,
          },
          resolved: false,
        });
      }

      if (
        item.stairsCount &&
        item.stairsCount > 25 &&
        mobility.stairTolerance === 'none'
      ) {
        alerts.push({
          id: `conflict-mob-stairs-${item.id}-${user.id}`,
          type: 'mobility',
          severity: 'critical',
          affectedUserId: user.id,
          eventId: item.id,
          description: `${item.title} has ~${item.stairsCount} steep stone steps without railings. ${user.name || 'Traveler'} cannot safely climb stairs.`,
          suggestedAction: {
            title: 'Enable Elevator Bypass Route',
            resolutionType: 'book_assistance',
            details: `Pre-notify monument authority for North Gate elevator key pass.`,
          },
          resolved: false,
        });
      }

      // 2. Dietary Conflict Check
      if (item.category === 'dining') {
        const userStrictDiets = dietary.filter((d) =>
          ['Jain', 'Vegan', 'Strict Vegetarian', 'Gluten-Free'].includes(d)
        );

        for (const diet of userStrictDiets) {
          const venueSupportsDiet = item.dietaryTags?.some(
            (t) => t.toLowerCase() === diet.toLowerCase()
          );

          if (!venueSupportsDiet) {
            alerts.push({
              id: `conflict-diet-${item.id}-${user.id}-${diet.toLowerCase()}`,
              type: 'dietary',
              severity: 'critical',
              affectedUserId: user.id,
              eventId: item.id,
              description: `${item.title} is a grill/specialty venue without verified ${diet} meal preparation for ${user.name || 'Traveler'}.`,
              suggestedAction: {
                title: 'Swap with Heritage Royal Thali (150m away)',
                resolutionType: 'swap_venue',
                details: `Swap dinner reservation to Surya Mahal, featuring a separate certified ${diet} kitchen and 4.9★ rating.`,
                replacementTitle: 'Surya Mahal Heritage Thali',
              },
              resolved: false,
            });
          }
        }
      }

      // 3. Circadian & Rest / Nap Conflict Check
      if (prefs.napWindow?.start && prefs.napWindow?.end && item.category === 'activity' && item.time) {
        const itemHour = parseInt(item.time.split(':')[0], 10);
        const napStartHour = parseInt(prefs.napWindow.start.split(':')[0], 10);
        const napEndHour = parseInt(prefs.napWindow.end.split(':')[0], 10);

        if (!isNaN(itemHour) && !isNaN(napStartHour) && !isNaN(napEndHour)) {
          if (itemHour >= napStartHour && itemHour < napEndHour) {
            alerts.push({
              id: `conflict-nap-${item.id}-${user.id}`,
              type: 'pacing',
              severity: 'warning',
              affectedUserId: user.id,
              eventId: item.id,
              description: `${item.title} at ${item.time} directly overlaps with ${user.name || 'traveler'}'s daily restorative rest window (${prefs.napWindow.start} - ${prefs.napWindow.end}).`,
              suggestedAction: {
                title: 'Shift Activity to Late Afternoon (16:30)',
                resolutionType: 'inject_buffer',
                details: `Reschedule ${item.title} to 16:30 PM when the sun is milder and allow a 90-minute rest buffer.`,
              },
              resolved: false,
            });
          }
        }
      }
    }
  }

  return alerts;
}
