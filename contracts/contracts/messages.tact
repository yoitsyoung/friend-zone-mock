
message SetProtocolFeeDestination {
    protocolFeeDestination: Address;
}

message SetProtocolFeePercent {
    protocolFeePercent: Int;
}

message SetShareFee {
    shareFee: Int;
}

message SetMintable {
    chatId: Int as int64;
    mintable: Bool;
}

message BuyShare {
    amount: Int as coins;
    receiver: Address;
}

message SellShare {
    seller: Address;
    amount: Int as coins;
}

message MintStatus {
    mintable: Bool;
}

message CreateShareSuccess {
    chatId: Int as int64;
}

message CreateShare {
    owner: Address;
    content: Cell;
    chatId: Int as int64;
    shareFeePercent: Int as uint256;
}

message InternalCreateShare {
    protocolFeePercent: Int as uint256;
    shareFeePercent: Int as uint256;
    content: Cell;
    originalSender: Address;
}

message Withdraw {
    value: Int as coins;
}

message WithdrawSuccess {
    amount: Int as coins;
}

message SendProtocolFeeSuccess {
    amount: Int as coins;
}

message SendShareFeeSuccess {
    amount: Int as coins;
}
