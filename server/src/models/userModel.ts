import { Schema, model, type Document } from "mongoose";
import bcrypt from "bcrypt";
import { UserRole, type IUser, type IAddress } from "../types/userTypes.js";

export interface IUserDocument extends Omit<IUser, "_id">, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const addressSchema = new Schema<IAddress>(
  {
    title: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    neighborhood: { type: String, trim: true },
    addressLine: { type: String, required: true, trim: true },
    zipCode: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true },
);

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Ad alanı zorunludur."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "E-posta alanı zorunludur."],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Şifre alanı zorunludur."],
      minlength: [6, "Şifre en az 6 karakter uzunluğunda olmalıdır."],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
    avatar: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    addresses: [addressSchema],
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    storeInfo: {
      storeName: { type: String, trim: true },
      description: { type: String },
      taxNumber: { type: String },
      isApproved: { type: Boolean, default: false },
    },
    courierInfo: {
      vehicleType: {
        type: String,
        enum: ["bicycle", "motorcycle", "car"],
      },
      plateNumber: { type: String, trim: true },
      isAvailable: { type: Boolean, default: true },
      activeOrderId: { type: Schema.Types.ObjectId, ref: "Order" },
    },
  },
  {
    timestamps: true,
  },
);

//* Password Hash
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//* Compare Password
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;

  if (/^\$2[aby]\$\d{2}\$/.test(this.password)) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  if (candidatePassword !== this.password) return false;

  this.password = candidatePassword;
  await this.save();
  return true;
};

export const User = model<IUserDocument>("User", userSchema);
