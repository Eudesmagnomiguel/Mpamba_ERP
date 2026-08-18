import { productService } from './product.service';
import { categoryService } from './category.service';
import { supplierService } from './supplier.service';
import { movementService } from './movement.service';
import { reportService } from './report.service';

export const stockServices = {
	...productService,
	...categoryService,
	...supplierService,
	...movementService,
	...reportService,
};

export default stockServices;
