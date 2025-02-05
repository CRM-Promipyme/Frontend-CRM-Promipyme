export function Spinner() {
    return (
        <div className="spinner-border text-light" role="status" style={{ width: '1.2rem', height: '1.2rem' }}>
            <span className="visually-hidden">Loading...</span>
        </div>
    );
}
