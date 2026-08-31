"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCollegeDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_college_dto_1 = require("./create-college.dto");
class UpdateCollegeDto extends (0, mapped_types_1.PartialType)(create_college_dto_1.CreateCollegeDto) {
}
exports.UpdateCollegeDto = UpdateCollegeDto;
//# sourceMappingURL=update-college.dto.js.map