import { Link } from "react-router";
import Import from "./Import";

interface LocationPageHeaderProps {
  windowWidth: number;
  level: string;
}

export default function LocationPageHeader({ windowWidth, level }: LocationPageHeaderProps) {
  return (
    <s-stack direction="inline" justifyContent="space-between" alignItems="center">
      <s-stack direction="inline" alignItems="center" gap="small-400">
        <s-icon type="catalog-product"></s-icon>
        <h2>All Locations</h2>
      </s-stack>
      {windowWidth > 768 ? (
        <s-stack direction="inline" gap="base">
          {level !== 'basic' && <Import />}
          <Link to="/app/addLocation">
            <s-button variant="primary" icon="plus-circle">Add Location</s-button>
          </Link>
        </s-stack>
      ) : (
        <s-stack direction="inline" justifyContent="end" gap="base">
          {level !== 'basic' && <Import />}
          <Link to="/app/addLocation">
            <s-button variant="primary" icon="plus-circle"></s-button>
          </Link>
        </s-stack>
      )}
    </s-stack>
  );
}
