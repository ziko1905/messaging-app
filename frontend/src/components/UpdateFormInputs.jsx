import PropTypes from "prop-types";
import UpdateValidator from "../utils/UpdateValidator";
import useValidator from "../hooks/useValidator";
import { useEffect } from "react";
import styles from "./styles/UpdateFormInputs.module.css";

export default function UpdateFormInputs({
  username,
  email,
  handleInputChange,
}) {
  const { validationErrors, changeFormData } = useValidator(UpdateValidator);
  const isUsernameValid = !!validationErrors.username;
  const isEmailValid = !!validationErrors.email;

  useEffect(() => {
    changeFormData("username", username);
    changeFormData("email", email);
  }, [username, email, changeFormData]);

  return (
    <>
      <label htmlFor="username">Username: </label>
      <div className={styles["input-container"]}>
        {isUsernameValid && (
          <span
            className={styles["validation-error"]}
            aria-label="Username input error"
          >
            {validationErrors.username}
          </span>
        )}
        <input
          value={username}
          onChange={handleInputChange}
          className={isUsernameValid && styles["invalid-input"]}
          type="text"
          name="username"
          id="username"
          aria-label="Username input"
        />
      </div>

      <label htmlFor="email">Email: </label>
      <div className={styles["input-container"]}>
        {isEmailValid && (
          <span
            className={styles["validation-error"]}
            aria-label="Email input error"
          >
            {validationErrors.email}
          </span>
        )}
        <input
          value={email}
          onChange={handleInputChange}
          className={isEmailValid && styles["invalid-input"]}
          type="email"
          name="email"
          id="email"
          aria-label="Email input"
        />
      </div>
    </>
  );
}
UpdateFormInputs.propTypes = {
  username: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  handleInputChange: PropTypes.func.isRequired,
};
