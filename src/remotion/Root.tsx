import { Composition } from "remotion";
import { InvitacionComposition, type InvitacionProps } from "./InvitacionComposition";

const DEFAULT_PROPS: InvitacionProps = {
  celebrantName: "Lucas",
  celebrantAge: 7,
  protagonistEmoji: "🚀",
  protagonistLabel: "Astronauta",
  parentMessage: "¡Estáis todos invitados a la fiesta de Lucas!",
  eventDate: "15 de junio de 2025",
  eventTime: "17:00",
  venue: "Jardines del Parque Central",
  primaryColor: "#FF3366",
  secondaryColor: "#8338EC",
  mood: "epic",
};

// Remotion v4 Composition requires a Zod schema as the first generic argument.
// We cast the component to avoid the two-type-arg constraint while keeping
// full type safety on defaultProps.
const TypedComposition = Composition as unknown as React.FC<{
  id: string;
  component: React.FC<InvitacionProps>;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaultProps: InvitacionProps;
}>;

export const RemotionRoot: React.FC = () => {
  return (
    <TypedComposition
      id="InvitacionFiesta"
      component={InvitacionComposition}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={DEFAULT_PROPS}
    />
  );
};
