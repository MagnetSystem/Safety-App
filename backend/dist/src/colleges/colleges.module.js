"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollegesModule = void 0;
const common_1 = require("@nestjs/common");
const colleges_service_1 = require("./colleges.service");
const colleges_controller_1 = require("./colleges.controller");
let CollegesModule = class CollegesModule {
};
exports.CollegesModule = CollegesModule;
exports.CollegesModule = CollegesModule = __decorate([
    (0, common_1.Module)({
        controllers: [colleges_controller_1.CollegesController],
        providers: [colleges_service_1.CollegesService],
        exports: [colleges_service_1.CollegesService],
    })
], CollegesModule);
//# sourceMappingURL=colleges.module.js.map