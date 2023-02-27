import Avvvatars from "avvvatars-react";

type StudentAvatarProps = {
  fullName: string;
  size: number;
  radius?: number;
  border?: { size?: number; color?: string };
};
export default function StudentAvatar({
  fullName,
  size,
  radius,
  border,
}: StudentAvatarProps) {
  return (
    <Avvvatars
      value={fullName}
      style="shape"
      size={size}
      radius={radius}
      border
      borderSize={border?.size || 0}
      borderColor={`${
        border?.color || "transparent"
      }; filter: brightness(0.95)`}
    />
  );
}
