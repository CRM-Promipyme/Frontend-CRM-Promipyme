import './../../styles/components/spinnerStyles.css';

export function Spinner() {
    return (
        <div className="spinner-border" role="status" style={{ width: '7.2rem', height: '7.2rem' }}>
            <span className="visually-hidden">Loading...</span>
        </div>
    );
}
