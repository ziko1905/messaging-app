import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import customFetch from "../utils/customFetch";
import { useAuth } from "../hooks/useAuth";
import ProfilePictureSelector from "../components/ProfilePictureSelector";
import apiErrorLogger from "../utils/apiErrorLogger";
import ErrorPopup from "../components/ErrorPopup";

export default function Settings() {
  const { user, token, logout, validate } = useAuth();
  const [updatedData, setUpdatedData] = useState({
    username: user?.username || "Loading...",
    email: user?.email || "Loading...",
  });
  const [prevPicture, setPrevPicture] = useState(null);
  const [updateInfo, setUpdateInfo] = useState("editing");
  const errorPopup = useRef();

  const isUpdated =
    user &&
    updateInfo != "loading" &&
    (updatedData.email != user?.email ||
      updatedData.username != user?.username ||
      updatedData.newPicBase64URI);

  useEffect(() => {
    if (user) {
      setUpdatedData({
        username: user.username,
        email: user.email,
      });
      customFetch(`/users/profile-picture/${user.username}`)
        .then((res) => {
          if (res.status != 200) throw new Error("No profile picture found");
          return res.blob();
        })
        .then((img) => {
          const picUrl = URL.createObjectURL(img);
          setPrevPicture(picUrl);
        })
        .catch(apiErrorLogger);
    }
  }, [user]);

  function handleUpdate() {
    setUpdateInfo("loading");
    customFetch("/users/update", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        senderUsername: user.username,
        ...(updatedData.username != user.username && {
          newUsername: updatedData.username,
        }),
        ...(updatedData.email != user.email && { newEmail: updatedData.email }),
        ...(updatedData.newPicBase64URI && {
          newPictureBase64: updatedData.newPicBase64URI,
        }),
      }),
    })
      .then(() => validate())
      .catch((error) => {
        apiErrorLogger(error);
        errorPopup.current.toggle();
      })
      .finally(() => setUpdateInfo("editing"));
  }

  function handleInputChange(e) {
    setUpdatedData((prevData) => ({
      ...prevData,
      [e.target.id]: e.target.value,
    }));
  }

  const handleProfPicSelect = useCallback((newPicBase64URI) => {
    setUpdatedData((prevData) => ({ ...prevData, newPicBase64URI }));
  }, []);

  return (
    <div>
      <Link to={"/"}></Link>
      <span>{user?.firstName || "Loading..."}</span>
      <span>{user?.lastName || "Loading..."}</span>
      <ErrorPopup ref={errorPopup} />
      <input
        value={updatedData.username}
        onChange={handleInputChange}
        type="text"
        name="username"
        id="username"
        aria-label="Username input"
      />
      <input
        value={updatedData.email}
        onChange={handleInputChange}
        type="email"
        name="email"
        id="email"
        aria-label="Email input"
      />
      <ProfilePictureSelector
        onImageSelect={handleProfPicSelect}
        defaultFormattedPicture={prevPicture}
      />
      <button disabled={!isUpdated} onClick={handleUpdate}>
        {updateInfo == "loading" ? "Loading..." : "Update"}
      </button>
      <button onClick={logout}>Log Out</button>
    </div>
  );
}
