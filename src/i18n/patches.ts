import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import { tr } from "./index";

// Toasts and native alerts are fired from non-React code all over the app,
// so translate them centrally instead of at every call site.
const showToast = Toast.show.bind(Toast);
Toast.show = (opts) =>
  showToast({
    ...opts,
    text1: opts?.text1 ? tr(opts.text1) : opts?.text1,
    text2: opts?.text2 ? tr(opts.text2) : opts?.text2,
  });

const showAlert = Alert.alert.bind(Alert);
Alert.alert = (title, message, buttons, options) =>
  showAlert(
    tr(title),
    message ? tr(message) : message,
    buttons?.map((b) => ({ ...b, text: b.text ? tr(b.text) : b.text })),
    options,
  );
