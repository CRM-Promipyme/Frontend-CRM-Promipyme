import './../../styles/components/spinnerStyles.css';

interface SpinnerProps {
    className?: string;
}

export function Spinner({ className = '' }: SpinnerProps) {
    return (
        <div className={`spinner-border ${className}`} role="status">
            <span className="visually-hidden">Loading...</span>
        </div>
    );
}
