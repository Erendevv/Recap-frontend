import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Car } from 'src/app/models/entities/car';
import { Customer } from 'src/app/models/entities/customer';
import { Rental } from 'src/app/models/entities/rental';
import { RentalDetailDto } from 'src/app/models/dtos/rentalDetailDto';
import { CarService } from 'src/app/services/car.service';
import { CustomerService } from 'src/app/services/customer.service';
import { RentalService } from 'src/app/services/rental.service';
import { FindeksService } from 'src/app/services/findeks.service';


@Component({
  selector: 'app-rental',
  templateUrl: './rental.component.html',
  styleUrls: ['./rental.component.css']
})
export class RentalComponent implements OnInit {
 
  carId:number;
  customers:Customer[];
  cars:Car[]
  rentals:Rental[]=[];
  dataLoaded=false;
  rentDate:Date;
  returnDate:Date;
  customerId:number;
  findeksLoad:boolean=true;
  findeksError:boolean=true;
  findeksMsg:string;
  @Input() car:Car;



  minDate:string | any;
  maxDate: string | null;
  maxMinDate: string | null;
  firstDateSelected: boolean = false;

  constructor(private rentalService:RentalService,
    private customerService:CustomerService,
    private toastrService:ToastrService,
    private router:Router,
    private datePipe:DatePipe,
    private carService:CarService,
    private activatedRoute:ActivatedRoute,
    private findeksService:FindeksService) { }

  ngOnInit(): void {
     this.activatedRoute.params.subscribe(params => {
    if(params["carId"]){
      this.carId = params["carId"];
      this.getCars(params["carId"]);
    }
  })
    this.getCustomer();
  }

  getRentals(){
    this.rentalService.getRentalDetails().subscribe(response => {
      this.rentals = response.data;
      this.dataLoaded=true;
    });
  }

  getCustomer(){
    this.customerService.getCustomers().subscribe(response => {
      this.customers = response.data;
      this.dataLoaded=true;
    })
  }

  getCars(carId:number){
    this.carService.GetCarDetailsById(carId).subscribe(response => {
      this.car= response.data[0]
    })
  }

  checkRentableCar(){
    this.rentalService.getRentalById(this.carId).subscribe(response => {
      if(response.data[0]==null){
        this.createRental();
        return true;
      }
      let lastItem = response.data[response.data.length-1]
      if(lastItem.returnDate==null){
        return this.toastrService.error('Bu araç teslim edilmemiş','Teslim Tarihi Geçersiz');
      }
      let returnDate = new Date(lastItem.returnDate);
      let rentDate = new Date(this.rentDate);
      if(rentDate < returnDate){
        return this.toastrService.error('Bu araç bu tarihler arasında kiralanamaz','Geçersiz tarih seçimi')
      }
      this.createRental();
      return true;
    })
  }

  createRental(){
    let createdRental : RentalDetailDto ={
      carId: this.car.id,
      brandName: this.car.brandName,
      colorName: this.car.colorName,
      modelYear: this.car.modelYear,
      dailyPrice: this.car.dailyPrice,
      description: this.car.description,
      rentDate: this.rentDate,
      returnDate: this.returnDate,
      customerId: this.customerId
    };
    if(createdRental.customerId == undefined || createdRental.rentDate == undefined){
      this.toastrService.error('Eksik bilgi girdiniz','Bilgilerinizi kontrol ediniz')
    }
    else{
      this.router.navigate(['/payment',JSON.stringify(createdRental)]);
      this.toastrService.info('Ödeme sayfasına yönlendiriliyorsunuz.','Ödeme İşlemleri')
    }
  }
  
  customerChange(event: any) {
    this.findeksLoad=false;

    this.findeksService.query(this.car.id,this.customerId).subscribe((response) => {
       if (response.success) {
        this.toastrService.success(response.message);
        this.findeksLoad=true;
       }
       else{
         this.findeksMsg=response.message;
         this.findeksLoad=false;
         this.findeksError=false;
         this.router.navigate(['/']);
         this.toastrService.error(response.message);
       } 
    });
  }

  getRentMinDate() {
    this.minDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    return this.minDate;
  }

  getReturnMinDate() {
    if (this.rentDate != undefined) {
      let stringToDate = new Date(this.rentDate);
      let new_date = new Date();
      new_date.setDate(stringToDate.getDate() + 1);
      return new_date.toISOString().slice(0, 10);
    } else {
      return this.rentDate;
    }
  }
  getReturnMaxDate() {
    this.maxDate = this.datePipe.transform(
      new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      'yyyy-MM-dd'
    );
    return this.maxDate;
  }

  onChangeEvent(event: any) {
    this.minDate = event.target.value;
    this.firstDateSelected = true;
  }


}
