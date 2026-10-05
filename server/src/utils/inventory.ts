import { BadRequestError } from "./AppError.js";

export interface InventoryLine {
  productId: unknown;
  quantity: number;
  name?: string;
}

export interface InventoryGateway {
  updateOne(
    filter: Record<string, unknown>,
    update: { $inc: { stock: number } },
  ): Promise<{ modifiedCount: number }>;
}

export const reserveInventory = async (
  lines: InventoryLine[],
  gateway: InventoryGateway,
): Promise<void> => {
  const reserved: InventoryLine[] = [];
  try {
    for (const line of lines) {
      const result = await gateway.updateOne(
        {
          _id: line.productId,
          isActive: true,
          stock: { $gte: line.quantity },
        },
        { $inc: { stock: -line.quantity } },
      );
      if (result.modifiedCount !== 1) {
        throw new BadRequestError(
          `${line.name ?? "Ürün"} için yeterli stok kalmadı.`,
        );
      }
      reserved.push(line);
    }
  } catch (error) {
    await restoreInventory(reserved, gateway);
    throw error;
  }
};

export const restoreInventory = async (
  lines: InventoryLine[],
  gateway: InventoryGateway,
): Promise<void> => {
  await Promise.all(
    lines.map((line) =>
      gateway.updateOne(
        { _id: line.productId },
        { $inc: { stock: line.quantity } },
      ),
    ),
  );
};
