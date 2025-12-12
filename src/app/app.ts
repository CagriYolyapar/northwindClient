import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private http = inject(HttpClient); //tercih edilen inject yönteminizdir(yeni standart)..Standart olarak bu tarz injectionlar her zaman top seviyede olmalıdır...
  protected readonly title = signal('NorthwindEntities');

  // constructor(private http:HttpClient){} eski usulde dependency inkection'i bu sekilde kullanırdık.Ancak artık Angular tarafında bu tavsiye edilmiyor. Onun yerine Angular kütüphanesinden gelen inject metodunu kullanmamız tavsiye ediliyor...

  //protected categories : any; //sadece signal'ın farkını göstermek icin actıgımız bir property'dir... short term purpose...(yani bu property'nin reactive olmadıgına gelir...Angular bu property üzerinde yapılan degişikliklere senkron cevap veremez... )

  //property'lerde bir şeyi component icindeki class'a ulasılabilir getirmek istersek standart protected

  protected categories = signal<any>([]); //fine grained changed detection...Yani bu signal ile olusturulan yapı track halindedir...signal'in degerinin degiştigi anlasıldıgı anda bu hemen sistem tarafından müdahaleye acık olacaktır...

  //Güncelleme yapmak icin secilen kategori
  protected selectedCategory = signal<any | null>(null);

  //ngOnInit(): void {
  //url

  //subscription

  //observable asenkron calısmalarda data stream akışını yönetmek icin elimize gecen bir nesnedir...Bir endpoint'e subscribe oldugunuzda işiniz bittikten sonra bu unsubscribe edilmezse sistem kaynaklarını harcamaya baslar...

  // this.http.get("http://localhost:5004/api/Category").subscribe({
  //       next : (response) => this.categories.set(response),//signal'in set ile ataması gerçekleştirilir,update güncellenmesi saglanır,() ile  de get edilmesi saglanır,
  //       //next : response => this.categories.set(response) //signal tarafında
  //       error:(error) => console.log(error),
  //       complete:() =>console.log("Request tamamlandı")
  // });

  //Eger bir subscription durumu mevcutsa unsubscribe yapmalısınız.Yoksa o user'in browser memory'sinde kaynak tüketilir...Ama http requestler complete edilir...Eger http request explicit sekilde complete edildigi Angular'da belirlendiyse o zaman otomatik olarak bu oservable'dan unsubscription olur...

  async ngOnInit() {
    //promise dedigimiz nesneler bir data sream olarak gözükmez aynı bir yere bir subscription olarak da gözükmez...Bu yüzden siz unsubscribe durumunu düsünmeden burada rahat bir cagrı yapabilirsiniz...
    this.categories.set(await this.getCategories());
  }

  async getCategories(): Promise<Object> {
    try {
      //burada async metot olusturuk diye await kullanmamız lazım diye düsünmeyni (C#'dan farklı davranır ve hatta standart olarak biz bu promislerde await kullanmamayı tercih ederiz)

      return lastValueFrom(this.http.get('http://localhost:5004/api/Category'));
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
