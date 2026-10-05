export enum UserRole {
  CUSTOMER = "customer",
  SELLER = "seller",
  COURIER = "courier",
  ADMIN = "admin",
}

export interface IAddress {
  _id?: string;
  title: string; // Örn: "Ev", "İş"
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood?: string;
  addressLine: string;
  zipCode?: string;
  isDefault: boolean;
}

export interface IStoreInfo {
  storeName: string;
  description?: string;
  taxNumber?: string;
  isApproved: boolean;
}

export interface ICourierInfo {
  vehicleType: "bicycle" | "motorcycle" | "car";
  plateNumber?: string;
  isAvailable: boolean;
  activeOrderId?: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  addresses: IAddress[];
  wishlist: string[]; // Product ObjectId dizisi
  storeInfo?: IStoreInfo;
  courierInfo?: ICourierInfo;
  createdAt: Date;
  updatedAt: Date;
}
