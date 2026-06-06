import {
  IoGrid,
  IoPeople,
  IoStorefront,
  IoDocumentText,
  IoCheckmarkCircle,
  IoCube,
  IoReceipt,
  IoBarChart,
  IoTime,
  IoSettings,
  IoPricetag,
  IoPerson,
  IoNotifications,
} from "react-icons/io5";

const icons = {
  grid: IoGrid,
  people: IoPeople,
  storefront: IoStorefront,
  document: IoDocumentText,
  checkmark: IoCheckmarkCircle,
  cube: IoCube,
  receipt: IoReceipt,
  "bar-chart": IoBarChart,
  time: IoTime,
  settings: IoSettings,
  pricetag: IoPricetag,
  person: IoPerson,
  notifications: IoNotifications,
};

export default function NavIcon({ name, className }) {
  const Icon = icons[name] || IoGrid;
  return <Icon className={className} />;
}
