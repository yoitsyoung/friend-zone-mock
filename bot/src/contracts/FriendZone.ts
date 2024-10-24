import type { Address, Cell, Builder, Slice } from "@ton/core";

export type CreateShare = {
  $$type: "CreateShare";
  owner: Address;
  content: Cell;
  chatId: bigint;
  shareFeePercent: bigint;
};

export function storeCreateShare(src: CreateShare) {
  return (builder: Builder) => {
    let b_0 = builder;
    b_0.storeUint(1647259364, 32);
    b_0.storeAddress(src.owner);
    b_0.storeRef(src.content);
    b_0.storeInt(src.chatId, 64);
    b_0.storeUint(src.shareFeePercent, 256);
  };
}

export function loadCreateShare(slice: Slice) {
  let sc_0 = slice;
  if (sc_0.loadUint(32) !== 1647259364) {
    throw Error("Invalid prefix");
  }
  let _owner = sc_0.loadAddress();
  let _content = sc_0.loadRef();
  let _chatId = sc_0.loadIntBig(64);
  let _shareFeePercent = sc_0.loadUintBig(256);
  return {
    $$type: "CreateShare" as const,
    owner: _owner,
    content: _content,
    chatId: _chatId,
    shareFeePercent: _shareFeePercent,
  };
}
