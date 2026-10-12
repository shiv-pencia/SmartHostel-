
import { Link } from "react-router";

function NotFoundPage() {
    return (
        <div className="container">
            <section className="simple-page">
                <p className="eyebrow">
                    ERROR 404
                </p>

                <h1>Page not found</h1>

                <p>
                    The page you are looking for
                    does not exist.
                </p>

                <Link
                    to="/"
                    className="button button-primary"
                >
                    Go Home
                </Link>
            </section>
        </div>
    );
}

export default NotFoundPage;
