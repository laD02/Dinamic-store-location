import { useNavigate } from "react-router";

interface BannerUpgradeProps {
  currentLevel: string;
  requiredLevel: 'advanced' | 'plus';
  featureName: string;
}

export default function BannerUpgrade({ currentLevel, requiredLevel, featureName }: BannerUpgradeProps) {
  const navigate = useNavigate();

  const planName = requiredLevel === 'plus' ? 'Business Plus' : 'Advanced';

  return (
    <div style={{ marginBottom: '20px' }}>
      <s-banner tone="info" heading={`${planName} Feature`} dismissible>
        <s-paragraph>
          The <b>{featureName}</b> feature is only available on the <b>{planName}</b> plan or higher. Your current plan is <b>{currentLevel.toUpperCase()}</b>.
        </s-paragraph>
        <div style={{ marginTop: '16px' }}>
          <s-button variant="secondary" onClick={() => navigate('/app/plan')}>Upgrade Plan</s-button>
        </div>
      </s-banner>
    </div>
  );
}
