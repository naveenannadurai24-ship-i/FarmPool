import { useEffect, useState } from "react";
import { useAppData } from "./AppData.jsx";
import { useLang } from "./LangContext.jsx";
import { useToast } from "./Toast.jsx";
import { usePath } from "./router.js";
import BottomBar from "./components/BottomBar.jsx";
import Header from "./components/Header.jsx";
import ListingDialog from "./components/ListingDialog.jsx";
import RequestDialog from "./components/RequestDialog.jsx";
import ListingsPage from "./pages/ListingsPage.jsx";
import OrderPage from "./pages/OrderPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import PoolsPage from "./pages/PoolsPage.jsx";

// `n` changes on every open, which remounts the dialog so its form starts fresh.
const closed = { open: false, n: 0 };
const opened = (s) => ({ open: true, n: s.n + 1 });
const closedKeepN = (s) => (s.open ? { ...s, open: false } : s);

export default function App() {
  const path = usePath();
  const { t } = useLang();
  const { metaError } = useAppData();
  const toast = useToast();
  const [listing, setListing] = useState(closed);
  const [request, setRequest] = useState(closed);

  const openListing = () => setListing(opened);
  const openRequest = () => setRequest(opened);

  useEffect(() => { window.scrollTo(0, 0); }, [path]);
  useEffect(() => { if (metaError) toast(t("err.meta")); }, [metaError]); // eslint-disable-line react-hooks/exhaustive-deps

  const orderMatch = path.match(/^\/order\/([\w-]+)$/);
  let page;
  if (orderMatch) page = <OrderPage key={orderMatch[1]} id={orderMatch[1]} />;
  else if (path === "/listings") page = <ListingsPage />;
  else if (path === "/pools") page = <PoolsPage />;
  else page = <OrdersPage onOpenListing={openListing} onOpenRequest={openRequest} />;

  return (
    <>
      <Header path={path} onOpenListing={openListing} onOpenRequest={openRequest} />
      <main className="wrap" id="view">{page}</main>
      <BottomBar onOpenListing={openListing} onOpenRequest={openRequest} />
      <ListingDialog key={`l${listing.n}`} open={listing.open} onClose={() => setListing(closedKeepN)} />
      <RequestDialog key={`r${request.n}`} open={request.open} onClose={() => setRequest(closedKeepN)} />
    </>
  );
}
