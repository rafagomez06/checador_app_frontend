import { Redirect } from "expo-router";

export default function Index() {
  // Aquí podrías verificar si el usuario está autenticado
  // Para este ejemplo, redirigimos al login
  return <Redirect href="/(auth)/login" />;
}
