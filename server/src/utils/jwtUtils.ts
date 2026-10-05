import jwt, {
  type JwtPayload,
  type Secret,
  type SignOptions,
} from "jsonwebtoken";

export interface TokenPayload extends JwtPayload {
  id: string;
  role: string;
}

const getJwtSecret = (): Secret => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET ortam değişkeni tanımlanmalıdır.");
  }
  return secret;
};

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as NonNullable<
  SignOptions["expiresIn"]
>;

export const generateToken = (id: string, role: string): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  };

  return jwt.sign({ id, role }, getJwtSecret(), options);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, getJwtSecret()) as unknown as TokenPayload;
};
