import { Cabinet, NavigationItem } from '../types';

export const cabinets: Cabinet[] = [
  { id: "cabinet1", name: "Cabinet 1", doors: ["Door 1", "Door 2", "Door 3", "Door 4"], active: true },
  { id: "cabinet2", name: "Cabinet 2", doors: ["Door 5", "Door 6", "Door 7", "Door 8"], active: false },
  // Virtual cabinet holds the bulk/fridge doors 9-14 (real OCSRI overflow storage).
  { id: "virtual", name: "Virtual", doors: ["Door 9", "Door 10", "Door 11", "Door 12", "Door 13", "Door 14"], active: false },
  // { id: "emergency_kit", name: "Emergency Kit", doors: ["Door 17", "Door 18", "Door 19"], active: false } // HIDDEN - uncomment to restore
];

export const navigationItems: NavigationItem[] = [
  { name: "The Oncology Clinic", icon: "calendar", hasSubmenu: false },
  { name: "My Work", icon: "briefcase", hasSubmenu: false },
  { name: "Appointments", icon: "calendar", hasSubmenu: false },
  { name: "Inventory", icon: "package", hasSubmenu: true, active: true },
  { name: "Audit", icon: "clipboard", hasSubmenu: false },
  { name: "Orders", icon: "file", hasSubmenu: false },
  { name: "Dispense", icon: "pill", hasSubmenu: false },
  { name: "Restock", icon: "refresh", hasSubmenu: false },
  { name: "Formulary", icon: "book", hasSubmenu: false },
  { name: "Transfer", icon: "truck", hasSubmenu: false },
  { name: "Patients", icon: "users", hasSubmenu: false },
  { name: "Stations", icon: "monitor", hasSubmenu: false },
  { name: "Admin", icon: "settings", hasSubmenu: false }
];