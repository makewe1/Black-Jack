// client/src/components/BuyModal.tsx
import "./BuyModal.css";

type Props = {
  onClose: () => void;
  onBuy: (amount: number) => void;
};

export default function BuyModal({ onClose, onBuy }: Props) {
  const amounts = [50, 100, 500, 1000, 5000, 10000];

  return (
    <div className="buy-modal-backdrop" onClick={onClose}>
      <div className="buy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="buy-modal-head">
          <h3>Buy Chips</h3>
          <button className="buy-close" onClick={onClose}>×</button>
        </div>
        <p className="buy-sub">Select the amount of chips you want to purchase.</p>
        <div className="buy-grid">
          {amounts.map((a) => (
            <button key={a} type="button" onClick={() => onBuy(a)}>
              {a} Chips
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
