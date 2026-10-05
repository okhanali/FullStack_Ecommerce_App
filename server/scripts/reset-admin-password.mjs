import { stdin, stdout } from "node:process";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const email = "admin@example.com";

const readHidden = (label) =>
  new Promise((resolve, reject) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
      reject(
        new Error(
          "Parola güvenliği için komutu etkileşimli TTY ile çalıştırın.",
        ),
      );
      return;
    }

    let value = "";
    const finish = (error) => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\u0003") {
          finish(new Error("İşlem iptal edildi."));
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
        } else {
          value += character;
        }
      }
    };

    stdout.write(label);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });

try {
  const password = await readHidden("Yeni admin parolası (gizli): ");
  if (password.length < 6) {
    throw new Error("Parola en az 6 karakter olmalıdır.");
  }

  const confirmation = await readHidden("Parolayı tekrar girin (gizli): ");
  if (password !== confirmation) {
    throw new Error("Girilen parolalar eşleşmiyor.");
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI tanımlı değil.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await mongoose.connection
    .collection("users")
    .updateOne(
      { email: email.toLowerCase() },
      { $set: { password: passwordHash } },
    );

  if (result.matchedCount === 0) {
    throw new Error(`${email} kullanıcısı bulunamadı.`);
  }

  stdout.write(`${email} admin hesabının parolası güncellendi.\n`);
} catch (error) {
  stdin.setRawMode?.(false);
  console.error(
    error instanceof Error ? error.message : "İşlem başarısız oldu.",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => undefined);
}
