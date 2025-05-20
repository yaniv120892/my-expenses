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
exports.SignupRequest = exports.VerifyLoginCodeRequest = exports.LoginRequest = exports.UpdateScheduledTransactionRequest = exports.CreateScheduledTransactionRequest = exports.WebhookRequest = exports.WebhookMessage = exports.WebhookChat = exports.GetTransactionsRequest = exports.GetTransactionsSummaryRequest = exports.UpdateTransactionStatusRequest = exports.UpdateTransactionRequest = exports.CreateTransactionRequest = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
//TODO: remove this import and create an enum for schedule types that is not depending on Prisma
const client_1 = require("@prisma/client");
function IsValidScheduledCombination(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isValidScheduledCombination',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(_, args) {
                    const { scheduleType, dayOfWeek, dayOfMonth } = args.object;
                    if (scheduleType === 'WEEKLY') {
                        if (dayOfWeek === undefined || dayOfWeek === null)
                            return false;
                        if (dayOfMonth !== undefined)
                            return false;
                    }
                    if (scheduleType === 'MONTHLY') {
                        if (dayOfMonth === undefined || dayOfMonth === null)
                            return false;
                        if (dayOfWeek !== undefined)
                            return false;
                    }
                    if (scheduleType !== 'WEEKLY' && dayOfWeek !== undefined)
                        return false;
                    if (scheduleType !== 'MONTHLY' && dayOfMonth !== undefined)
                        return false;
                    return true;
                },
            },
        });
    };
}
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
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTransactionRequest.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransactionRequest.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], CreateTransactionRequest.prototype, "date", void 0);
class UpdateTransactionRequest {
}
exports.UpdateTransactionRequest = UpdateTransactionRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTransactionRequest.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateTransactionRequest.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateTransactionRequest.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTransactionRequest.prototype, "type", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], UpdateTransactionRequest.prototype, "date", void 0);
class UpdateTransactionStatusRequest {
}
exports.UpdateTransactionStatusRequest = UpdateTransactionStatusRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTransactionStatusRequest.prototype, "status", void 0);
class GetTransactionsSummaryRequest {
}
exports.GetTransactionsSummaryRequest = GetTransactionsSummaryRequest;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], GetTransactionsSummaryRequest.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
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
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], GetTransactionsRequest.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
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
class CreateScheduledTransactionRequest {
}
exports.CreateScheduledTransactionRequest = CreateScheduledTransactionRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateScheduledTransactionRequest.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateScheduledTransactionRequest.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateScheduledTransactionRequest.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateScheduledTransactionRequest.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ScheduleType),
    __metadata("design:type", String)
], CreateScheduledTransactionRequest.prototype, "scheduleType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateScheduledTransactionRequest.prototype, "interval", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateScheduledTransactionRequest.prototype, "dayOfWeek", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateScheduledTransactionRequest.prototype, "dayOfMonth", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateScheduledTransactionRequest.prototype, "monthOfYear", void 0);
__decorate([
    IsValidScheduledCombination({
        message: 'Invalid combination of scheduleType, dayOfWeek, and dayOfMonth',
    }),
    __metadata("design:type", Object)
], CreateScheduledTransactionRequest.prototype, "dummy", void 0);
class UpdateScheduledTransactionRequest {
}
exports.UpdateScheduledTransactionRequest = UpdateScheduledTransactionRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateScheduledTransactionRequest.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateScheduledTransactionRequest.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateScheduledTransactionRequest.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateScheduledTransactionRequest.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ScheduleType),
    __metadata("design:type", String)
], UpdateScheduledTransactionRequest.prototype, "scheduleType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateScheduledTransactionRequest.prototype, "interval", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateScheduledTransactionRequest.prototype, "dayOfWeek", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateScheduledTransactionRequest.prototype, "dayOfMonth", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateScheduledTransactionRequest.prototype, "monthOfYear", void 0);
__decorate([
    IsValidScheduledCombination({
        message: 'Invalid combination of scheduleType, dayOfWeek, and dayOfMonth',
    }),
    __metadata("design:type", Object)
], UpdateScheduledTransactionRequest.prototype, "dummy", void 0);
class LoginRequest {
}
exports.LoginRequest = LoginRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginRequest.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginRequest.prototype, "password", void 0);
class VerifyLoginCodeRequest {
}
exports.VerifyLoginCodeRequest = VerifyLoginCodeRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], VerifyLoginCodeRequest.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyLoginCodeRequest.prototype, "code", void 0);
class SignupRequest {
}
exports.SignupRequest = SignupRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SignupRequest.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SignupRequest.prototype, "password", void 0);
