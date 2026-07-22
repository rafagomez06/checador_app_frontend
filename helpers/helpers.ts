import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

//Helpers de obtencion de fecha actual
//Ajuste zona horaria
dayjs.extend(utc);
dayjs.extend(timezone);
// obtener fecha actual
export const obtenerFechaLocal = (diasOffset: number = 0): string => {
  return dayjs()
    .tz("America/Mexico_City")
    .add(diasOffset, "day")
    .format("YYYY-MM-DD");
};
