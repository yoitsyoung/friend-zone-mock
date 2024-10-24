import { Address, Builder, Cell, Slice, address } from "@ton/core";

export type BuyShare = {
  $$type: "BuyShare";
  amount: bigint;
  receiver: Address;
};

export function storeBuyShare(src: BuyShare) {
  return (builder: Builder) => {
    let b_0 = builder;
    b_0.storeUint(4207331554, 32);
    b_0.storeCoins(src.amount);
    b_0.storeAddress(src.receiver);
  };
}

export function loadBuyShare(slice: Slice) {
  let sc_0 = slice;
  if (sc_0.loadUint(32) !== 4207331554) {
    throw Error("Invalid prefix");
  }
  let _amount = sc_0.loadCoins();
  let _receiver = sc_0.loadAddress();
  return { $$type: "BuyShare" as const, amount: _amount, receiver: _receiver };
}

export type SellShare = {
  $$type: "SellShare";
  seller: Address;
  amount: bigint;
};

export function storeSellShare(src: SellShare) {
  return (builder: Builder) => {
    let b_0 = builder;
    b_0.storeUint(2997963688, 32);
    b_0.storeAddress(src.seller);
    b_0.storeCoins(src.amount);
  };
}

export function loadSellShare(slice: Slice) {
  let sc_0 = slice;
  if (sc_0.loadUint(32) !== 2997963688) {
    throw Error("Invalid prefix");
  }
  let _seller = sc_0.loadAddress();
  let _amount = sc_0.loadCoins();
  return { $$type: "SellShare" as const, seller: _seller, amount: _amount };
}
