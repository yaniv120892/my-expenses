"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookRequest = exports.WebhookMessage = exports.WebhookChat = exports.GetTransactionsRequest = exports.GetTransactionsSummaryRequest = exports.CreateTransactionRequest = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateTransactionRequest {
}
exports.CreateTransactionRequest = CreateTransactionRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransactionRequest.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateTransactionRequest.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTransactionRequest.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransactionRequest.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], CreateTransactionRequest.prototype, "date", void 0);
class GetTransactionsSummaryRequest {
}
exports.GetTransactionsSummaryRequest = GetTransactionsSummaryRequest;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], GetTransactionsSummaryRequest.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], GetTransactionsSummaryRequest.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GetTransactionsSummaryRequest.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetTransactionsSummaryRequest.prototype, "type", void 0);
class GetTransactionsRequest {
}
exports.GetTransactionsRequest = GetTransactionsRequest;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], GetTransactionsRequest.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], GetTransactionsRequest.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GetTransactionsRequest.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetTransactionsRequest.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetTransactionsRequest.prototype, "searchTerm", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], GetTransactionsRequest.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(10),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], GetTransactionsRequest.prototype, "perPage", void 0);
class WebhookChat {
}
exports.WebhookChat = WebhookChat;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], WebhookChat.prototype, "id", void 0);
class WebhookMessage {
}
exports.WebhookMessage = WebhookMessage;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WebhookMessage.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    __metadata("design:type", WebhookChat)
], WebhookMessage.prototype, "chat", void 0);
class WebhookRequest {
}
exports.WebhookRequest = WebhookRequest;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    __metadata("design:type", WebhookMessage)
], WebhookRequest.prototype, "message", void 0);
