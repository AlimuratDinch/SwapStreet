import styles from "../ChatLayout.module.css";

type AvatarProps = {
  src?: string | null;
  size?: number;
  className?: string;
};

const toRem = (size: number) => `${size * 0.25}rem`;

export default function Avatar({ src, size = 10, className }: AvatarProps) {
  const dimension = toRem(size);
  return (
    <img
      src={src || "/images/default-avatar-icon.jpg"}
      alt=""
      className={[styles.avatar, className].filter(Boolean).join(" ")}
      style={{ width: dimension, height: dimension }}
    />
  );
}
