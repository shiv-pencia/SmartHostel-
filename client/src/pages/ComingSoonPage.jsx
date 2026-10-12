
import { Link } from "react-router";

function ComingSoonPage({
    title,
    description,
}) {
    return (
        <div className="container">
            <section className="simple-page">
                <p className="eyebrow">
                    UNDER DEVELOPMENT
                </p>

                <h1>{title}</h1>

                <p>{description}</p>

                <Link
                    to="/"
                    className="button button-secondary"
                >
                    Back to Home
                </Link>
            </section>
        </div>
    );
}

export default ComingSoonPage;
