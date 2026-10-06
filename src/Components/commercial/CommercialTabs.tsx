import React, { useRef } from "react";
import {
  COMMERCIAL_TAB_CONFIG,
  type CommercialTabKey,
} from "../../Pages/commercial/commercial.helpers";

export type CommercialTabsProps = {
  activeTab: CommercialTabKey;
  onSelectTab: (tab: CommercialTabKey) => void;
  badges?: Partial<Record<CommercialTabKey, number | string>>;
};

export default function CommercialTabs({
  activeTab,
  onSelectTab,
  badges,
}: CommercialTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      nextIndex = (index + 1) % COMMERCIAL_TAB_CONFIG.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      nextIndex = (index - 1 + COMMERCIAL_TAB_CONFIG.length) % COMMERCIAL_TAB_CONFIG.length;
    } else if (event.key === "Home") {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      nextIndex = COMMERCIAL_TAB_CONFIG.length - 1;
    }

    if (nextIndex !== null) {
      const nextTab = COMMERCIAL_TAB_CONFIG[nextIndex].key;
      onSelectTab(nextTab);
      const nextButton = tabRefs.current[nextIndex];
      if (nextButton) {
        nextButton.focus();
      }
    }
  };

  return (
    <div className="commercial-tabs-wrapper">
      <nav
        role="tablist"
        aria-label="Navegação da Gestão Comercial"
        className="commercial-tabs-nav"
      >
        {COMMERCIAL_TAB_CONFIG.map((item, index) => {
          const isActive = activeTab === item.key;
          const badgeValue = badges?.[item.key];
          return (
            <button
              key={item.key}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`commercial-tab-${item.key}`}
              aria-selected={isActive}
              aria-controls={`commercial-tabpanel-${item.key}`}
              tabIndex={isActive ? 0 : -1}
              className={`commercial-tab-btn ${isActive ? "commercial-tab-btn--active" : ""}`}
              onClick={() => onSelectTab(item.key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <span className="commercial-tab-label">{item.label}</span>
              {badgeValue !== undefined && badgeValue !== null && badgeValue !== "" ? (
                <span className="commercial-tab-badge" aria-label={`${badgeValue} itens`}>
                  {badgeValue}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
