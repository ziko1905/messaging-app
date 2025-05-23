import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import styles from "./styles/SearchCard.module.css";
import { useProfilePicture } from "../hooks/useProfilePicture";

export default function SearchCard({ username, searchBarRef }) {
  const profilePictureSrc = useProfilePicture(username);
  const navigate = useNavigate();

  function handleClick(e) {
    e.preventDefault();
    navigate(`/${username}`);
    searchBarRef.current.blur();
  }

  return (
    <div
      className={styles["search-card"]}
      tabIndex={-1}
      onMouseDown={handleClick}
      aria-label={`${username} user`}
    >
      <img
        className={`profile-picture ${styles["profile-picture"]}`}
        src={profilePictureSrc}
        alt={`${username} profile picture`}
      />
      <span className={styles["username-span"]}>{username}</span>
    </div>
  );
}

SearchCard.propTypes = {
  username: PropTypes.string.isRequired,
  photoId: PropTypes.string,
  searchBarRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
};
