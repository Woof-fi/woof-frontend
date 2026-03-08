/**
 * Font Awesome SVG icon registry.
 *
 * Only the icons actually used in the app are imported here.
 * This replaces the full CSS + webfont bundle (~225 KB fonts + ~100 KB CSS)
 * with tree-shaken SVG definitions (~30 KB gzipped).
 *
 * To add a new icon:
 *   1. Find the import name at https://fontawesome.com/search
 *   2. Add the import below (solid → free-solid-svg-icons, regular → free-regular-svg-icons)
 *   3. Add it to the library.add() call
 *
 * The `dom.watch()` call auto-replaces <i class="fas fa-*"> tags with inline SVGs.
 */
import { library, dom, config } from '@fortawesome/fontawesome-svg-core';

// We import the CSS manually in main.ts — prevent FA from injecting it again
config.autoAddCss = false;

// Solid icons (fas)
import {
    faArrowDown,
    faArrowLeft,
    faArrowRight,
    faArrowUpRightFromSquare,
    faBars,
    faBell as faBellSolid,
    faBookmark as faBookmarkSolid,
    faCakeCandles,
    faCalendar,
    faCalendarCheck,
    faCalendarPlus,
    faCamera,
    faChair,
    faCloudArrowUp,
    faCheck,
    faChevronLeft,
    faChevronRight,
    faCircleCheck,
    faCircleExclamation,
    faCircleUser,
    faClipboardCheck,
    faClock as faClockSolid,
    faComment as faCommentSolid,
    faCommentDots,
    faComments,
    faCompass,
    faDog,
    faDroplet,
    faEllipsis,
    faEnvelope,
    faEnvelopeOpenText,
    faEye,
    faFileLines,
    faFlag,
    faFlask,
    faFloppyDisk,
    faHand,
    faHeart as faHeartSolid,
    faHeartPulse,
    faHourglass as faHourglassSolid,
    faHouse,
    faImage,
    faImages,
    faLightbulb,
    faLink,
    faLocationDot,
    faLock,
    faMagnifyingGlass,
    faMapPin,
    faNoteSticky,
    faPaperPlane as faPaperPlaneSolid,
    faPaw,
    faPen,
    faPenToSquare,
    faPencil,
    faPersonRunning,
    faPersonWalking,
    faPills,
    faPlus,
    faPlusCircle,
    faRightFromBracket,
    faRobot,
    faRulerCombined,
    faShareNodes,
    faShieldHalved,
    faSpinner,
    faSquarePlus,
    faStar,
    faStethoscope,
    faStream,
    faSyringe,
    faTableCells,
    faThLarge,
    faTimes,
    faTrash,
    faTrashCan,
    faTree,
    faUmbrella,
    faUser,
    faUserCheck,
    faUserGroup,
    faUserPlus,
    faUserSlash,
    faUsers,
    faWeightScale,
} from '@fortawesome/free-solid-svg-icons';

// Regular icons (far) — outline variants
import {
    faBell,
    faBookmark,
    faClock,
    faComment,
    faHeart,
    faHourglass,
    faPaperPlane,
} from '@fortawesome/free-regular-svg-icons';

// Register all icons
library.add(
    // Solid
    faArrowDown, faArrowLeft, faArrowRight, faArrowUpRightFromSquare,
    faBars, faBellSolid, faBookmarkSolid, faCakeCandles, faCalendar,
    faCalendarCheck, faCalendarPlus, faCamera, faChair, faCheck, faCloudArrowUp,
    faChevronLeft, faChevronRight, faCircleCheck, faCircleExclamation,
    faCircleUser, faClipboardCheck, faClockSolid, faCommentSolid,
    faCommentDots, faComments, faCompass, faDog, faDroplet, faEllipsis,
    faEnvelope, faEnvelopeOpenText, faEye, faFileLines, faFlag, faFlask,
    faFloppyDisk, faHand, faHeartSolid, faHeartPulse, faHourglassSolid,
    faHouse, faImage, faImages, faLightbulb, faLink, faLocationDot,
    faLock, faMagnifyingGlass, faMapPin, faNoteSticky, faPaperPlaneSolid,
    faPaw, faPen, faPenToSquare, faPencil, faPersonRunning,
    faPersonWalking, faPills, faPlus, faPlusCircle, faRightFromBracket,
    faRobot, faRulerCombined, faShareNodes, faShieldHalved, faSpinner,
    faSquarePlus, faStar, faStethoscope, faStream, faSyringe,
    faTableCells, faThLarge, faTimes, faTrash, faTrashCan, faTree,
    faUmbrella, faUser, faUserCheck, faUserGroup, faUserPlus,
    faUserSlash, faUsers, faWeightScale,
    // Regular
    faBell, faBookmark, faClock, faComment, faHeart, faHourglass,
    faPaperPlane,
);

// Auto-replace <i> tags with inline SVGs
dom.watch();
