/**
 * Mock data for Woof prototypes.
 * All data is hardcoded — no backend calls needed.
 */

function futureTime(hoursFromNow) {
    return new Date(Date.now() + hoursFromNow * 3600000).toISOString();
}

function pastTime(hoursAgo) {
    return new Date(Date.now() - hoursAgo * 3600000).toISOString();
}

const FALLBACK_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23E8D5B7" width="150" height="150" rx="75"/%3E%3Ctext fill="%238B6914" font-family="Arial" font-size="50" x="50%25" y="55%25" text-anchor="middle" dy=".1em"%3E🐕%3C/text%3E%3C/svg%3E';

const FALLBACK_POST = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%23F5F5F3" width="500" height="500"/%3E%3Ctext fill="%23A8A8A8" font-family="Arial" font-size="40" x="50%25" y="50%25" text-anchor="middle" dy=".1em"%3E🐾%3C/text%3E%3C/svg%3E';

export const MOCK_DOGS = [
    {
        id: 'mock-dog-1',
        name: 'Rex',
        slug: 'rex-1234',
        breedName: 'German Shepherd',
        breedSlug: 'german-shepherd',
        profilePhoto: FALLBACK_AVATAR,
        territoryName: 'Kallio',
        territoryParentName: 'Helsinki',
        isFollowing: true,
    },
    {
        id: 'mock-dog-2',
        name: 'Luna',
        slug: 'luna-5678',
        breedName: 'Golden Retriever',
        breedSlug: 'golden-retriever',
        profilePhoto: FALLBACK_AVATAR,
        territoryName: 'Töölö',
        territoryParentName: 'Helsinki',
        isFollowing: true,
    },
    {
        id: 'mock-dog-3',
        name: 'Bella',
        slug: 'bella-9012',
        breedName: 'Finnish Lapphund',
        breedSlug: 'finnish-lapphund',
        profilePhoto: FALLBACK_AVATAR,
        territoryName: 'Kallio',
        territoryParentName: 'Helsinki',
        isFollowing: false,
    },
    {
        id: 'mock-dog-4',
        name: 'Max',
        slug: 'max-3456',
        breedName: 'Border Collie',
        breedSlug: 'border-collie',
        profilePhoto: FALLBACK_AVATAR,
        territoryName: 'Kamppi',
        territoryParentName: 'Helsinki',
        isFollowing: false,
    },
    {
        id: 'mock-dog-5',
        name: 'Nelli',
        slug: 'nelli-7890',
        breedName: 'Cavalier King Charles Spaniel',
        breedSlug: 'cavalier-king-charles-spaniel',
        profilePhoto: FALLBACK_AVATAR,
        territoryName: 'Kruununhaka',
        territoryParentName: 'Helsinki',
        isFollowing: false,
    },
];

export const MOCK_PARKS = [
    {
        id: 'mock-park-1',
        name: 'Pengerpuiston koirapuisto',
        slug: 'pengerpuiston-koirapuisto',
        address: 'Pengerkatu, Kallio, Helsinki',
        followerCount: 42,
        isFollowing: true,
    },
    {
        id: 'mock-park-2',
        name: 'Hesperian koirapuisto',
        slug: 'hesperian-koirapuisto',
        address: 'Hesperian puisto, Töölö, Helsinki',
        followerCount: 35,
        isFollowing: true,
    },
    {
        id: 'mock-park-3',
        name: 'Sinebrychoffin koirapuisto',
        slug: 'sinebrychoffin-koirapuisto',
        address: 'Sinebrychoffin puisto, Helsinki',
        followerCount: 28,
        isFollowing: false,
    },
    {
        id: 'mock-park-4',
        name: 'Arabianrannan koirapuisto',
        slug: 'arabianrannan-koirapuisto',
        address: 'Arabianranta, Helsinki',
        followerCount: 19,
        isFollowing: false,
    },
];

export const MOCK_POSTS = [
    {
        id: 'mock-post-1',
        profilePic: FALLBACK_AVATAR,
        username: 'Rex',
        dogSlug: 'rex-1234',
        dogId: 'mock-dog-1',
        imageUrl: FALLBACK_POST,
        caption: 'Beautiful morning walk in Kallio! The snow is perfect today.',
        likeCount: 24,
        commentCount: 5,
        likedByUser: false,
        createdAt: pastTime(2),
        updatedAt: pastTime(2),
        breedName: 'German Shepherd',
        breedSlug: 'german-shepherd',
        territoryName: 'Kallio',
        territoryType: 'district',
        territoryParentName: 'Helsinki',
        territoryGrandparentName: '',
        territoryUrlPath: 'finland/helsinki/kallio',
    },
    {
        id: 'mock-post-2',
        profilePic: FALLBACK_AVATAR,
        username: 'Luna',
        dogSlug: 'luna-5678',
        dogId: 'mock-dog-2',
        imageUrl: FALLBACK_POST,
        caption: 'First time at the dog park! Luna loved it.',
        likeCount: 31,
        commentCount: 8,
        likedByUser: true,
        createdAt: pastTime(5),
        updatedAt: pastTime(5),
        breedName: 'Golden Retriever',
        breedSlug: 'golden-retriever',
        territoryName: 'Töölö',
        territoryType: 'district',
        territoryParentName: 'Helsinki',
        territoryGrandparentName: '',
        territoryUrlPath: 'finland/helsinki/toolo',
    },
    {
        id: 'mock-post-3',
        profilePic: FALLBACK_AVATAR,
        username: 'Bella',
        dogSlug: 'bella-9012',
        dogId: 'mock-dog-3',
        imageUrl: FALLBACK_POST,
        caption: 'Bella made a new friend today! 🐾',
        likeCount: 18,
        commentCount: 3,
        likedByUser: false,
        createdAt: pastTime(8),
        updatedAt: pastTime(8),
        breedName: 'Finnish Lapphund',
        breedSlug: 'finnish-lapphund',
        territoryName: 'Kallio',
        territoryType: 'district',
        territoryParentName: 'Helsinki',
        territoryGrandparentName: '',
        territoryUrlPath: 'finland/helsinki/kallio',
    },
    {
        id: 'mock-post-4',
        profilePic: FALLBACK_AVATAR,
        username: 'Max',
        dogSlug: 'max-3456',
        dogId: 'mock-dog-4',
        imageUrl: FALLBACK_POST,
        caption: 'Agility training went great! Max is getting faster every week.',
        likeCount: 42,
        commentCount: 12,
        likedByUser: false,
        createdAt: pastTime(12),
        updatedAt: pastTime(12),
        breedName: 'Border Collie',
        breedSlug: 'border-collie',
        territoryName: 'Kamppi',
        territoryType: 'district',
        territoryParentName: 'Helsinki',
        territoryGrandparentName: '',
        territoryUrlPath: 'finland/helsinki/kamppi',
    },
    {
        id: 'mock-post-5',
        profilePic: FALLBACK_AVATAR,
        username: 'Nelli',
        dogSlug: 'nelli-7890',
        dogId: 'mock-dog-5',
        imageUrl: FALLBACK_POST,
        caption: 'Cozy afternoon nap after a long walk.',
        likeCount: 55,
        commentCount: 7,
        likedByUser: true,
        createdAt: pastTime(24),
        updatedAt: pastTime(24),
        breedName: 'Cavalier King Charles Spaniel',
        breedSlug: 'cavalier-king-charles-spaniel',
        territoryName: 'Kruununhaka',
        territoryType: 'district',
        territoryParentName: 'Helsinki',
        territoryGrandparentName: '',
        territoryUrlPath: 'finland/helsinki/kruununhaka',
    },
];

export const MOCK_PARK_VISITS = [
    {
        id: 'mock-visit-1',
        dog: MOCK_DOGS[0],
        park: MOCK_PARKS[0],
        arrivalAt: futureTime(1),
        durationMinutes: 60,
        note: 'Anyone want to join for a run?',
    },
    {
        id: 'mock-visit-2',
        dog: MOCK_DOGS[1],
        park: MOCK_PARKS[1],
        arrivalAt: futureTime(2.5),
        durationMinutes: 45,
        note: '',
    },
    {
        id: 'mock-visit-3',
        dog: MOCK_DOGS[3],
        park: MOCK_PARKS[0],
        arrivalAt: futureTime(4),
        durationMinutes: 30,
        note: 'Quick afternoon visit!',
    },
    {
        id: 'mock-visit-4',
        dog: MOCK_DOGS[4],
        park: MOCK_PARKS[2],
        arrivalAt: futureTime(6),
        durationMinutes: 90,
        note: 'Evening walk with friends',
    },
    {
        id: 'mock-visit-5',
        dog: MOCK_DOGS[2],
        park: MOCK_PARKS[1],
        arrivalAt: futureTime(24),
        durationMinutes: 60,
        note: '',
    },
];

export const MOCK_NEW_DOGS = [
    {
        id: 'mock-newdog-1',
        name: 'Lumi',
        breedName: 'Samoyed',
        territoryName: 'Kallio',
        territoryType: 'sub_district',
        profilePhoto: FALLBACK_AVATAR,
        joinedAt: pastTime(3),
    },
    {
        id: 'mock-newdog-2',
        name: 'Otso',
        breedName: 'Finnish Spitz',
        territoryName: 'Kruununhaka',
        territoryType: 'sub_district',
        profilePhoto: FALLBACK_AVATAR,
        joinedAt: pastTime(8),
    },
    {
        id: 'mock-newdog-3',
        name: 'Wilma',
        breedName: 'Dachshund',
        territoryName: 'Töölö',
        territoryType: 'district',
        profilePhoto: FALLBACK_AVATAR,
        joinedAt: pastTime(18),
    },
];

/** Low-level districts the mock user follows (sub_district level only) */
export const MOCK_FOLLOWED_DISTRICTS = ['Kallio', 'Kruununhaka'];

export const MOCK_TERRITORY_ACTIVITY = [
    { territory: 'Kallio', postsThisWeek: 14, newDogs: 3, upcomingVisits: 5 },
    { territory: 'Kruununhaka', postsThisWeek: 8, newDogs: 1, upcomingVisits: 2 },
    { territory: 'Töölö', postsThisWeek: 11, newDogs: 2, upcomingVisits: 4 },
];

export const HEALTH_RECORD_TYPES = [
    { value: 'vet_visit', label: 'Vet visit', icon: 'fa-stethoscope' },
    { value: 'vaccination', label: 'Vaccination', icon: 'fa-syringe' },
    { value: 'medication', label: 'Medication', icon: 'fa-pills' },
    { value: 'weight', label: 'Weight', icon: 'fa-weight-scale' },
    { value: 'note', label: 'Note', icon: 'fa-note-sticky' },
];

export function formatVisitTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const time = date.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today ${time}`;
    if (isTomorrow) return `Tomorrow ${time}`;
    return date.toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'short' }) + ` ${time}`;
}

export function formatDuration(minutes) {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
