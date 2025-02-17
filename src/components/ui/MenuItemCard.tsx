import { Link } from "react-router-dom";
import "../../styles/components/menuItemCard.css";

interface MenuItemCardProps {
    title: string;
    description: string;
    icon: string;
    url: string;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ title, description, icon, url }) => {


    return (
        <div className="menu-item-card card-body text-center">
            <Link to={url} className="menu-item-card-link">
                <div className="menu-item-card-icon">
                    <i className={icon}></i>
                </div>
                <div className="menu-item-card-content">
                    <h3>{title}</h3>
                    <p>{description}</p>
                </div>
            </Link>
        </div>
    );
};