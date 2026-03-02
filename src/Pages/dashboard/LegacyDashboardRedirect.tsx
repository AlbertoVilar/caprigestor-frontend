import { Navigate, useSearchParams } from "react-router-dom";
import { resolveLegacyDashboardPath } from "../../utils/lastGoatContext";

export default function LegacyDashboardRedirect() {
  const [searchParams] = useSearchParams();

  const targetPath = resolveLegacyDashboardPath({
    farmId: searchParams.get("farmId"),
    goatId: searchParams.get("goatId"),
    registrationNumber: searchParams.get("registrationNumber"),
  });

  return <Navigate to={targetPath} replace />;
}
