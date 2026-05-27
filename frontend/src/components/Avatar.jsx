import React from "react";
import { initials } from "../lib/helpers";

const Avatar = ({ name, color = "#E8A0BF", size = 40, photo = "" }) => {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
      />
    );
  }
  return (
    <span
      className="avatar-initial"
      data-testid="avatar"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        fontSize: size * 0.38,
        boxShadow: `0 4px 12px ${color}40`,
      }}
    >
      {initials(name)}
    </span>
  );
};

export default Avatar;
