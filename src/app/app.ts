import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf],
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

  //-------------Creation--------------

  protected newCategoryName = signal<string>('');
  protected newCategoryDescription = signal<string>('');

  //Formumuzdaki Kategori ismi input'u degiştigi zaman calısacak metodumuz
  onNewCategoryNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.newCategoryName.set(value);
  }

  //Formumuzdaki Kategori acıklama input'u degiştiginde calısacak metodumuz
  onNewCategoryDescriptionChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.newCategoryDescription.set(value); //signal degeri atanması
  }

  //Ekle butonuna basıldıgında form'umuzun submit olmasını istiyoruz
  async addCategory(event: Event) {
    //Form submit edildigi anda browser'in varsayılan davranısı sayfayı yenilemektir...
    //Bunu engelliyoruz ki SPA davranısıyla devam edelim
    event.preventDefault();

    //Gönderilecek body'nin hazırlanması lazım...Bu , backEnd tarafımızın bekledigi modele karsılık gelmeli

    const body = {
      //Id backend tarafından olusturulacagı icin buraya vermiyoruz zaten modeleimiz de öyle bir property beklemiyor
      categoryName: this.newCategoryName(),
      description: this.newCategoryDescription(),
    };

    try {
      //Bu noktada API'ya artık bir post istegi yapmamız lazım..Lakin burada dikkat etmemiz gereken nokta bize API nasıl bir response döndürecek...

      const message = await lastValueFrom(
        this.http.post('http://localhost:5004/api/Category', body, {
          responseType: 'text', //bizim mevcut kullandıgımız API'da bize gelen cevap text haldedir...Eger bunu yapmazsanız sistem varsayılan olarak json deserialize etmeye calısır
        })
      );

      console.log('API mesajı ', message);

      //Basarılıysa signal value'umuzu tekrar set etmeliyiz...En dogrusu server'dan listeyi yeniden cekmek :
      this.categories.set(await this.getCategories());

      //Form alanlarının resetlenmesi
      this.newCategoryName.set('');
      this.newCategoryDescription.set('');
    } catch (error) {
      console.log(error);
    }
  }

  //----------------------Update-------------

  //Tablo satırındaki GÜncelle butonuna bastıgımızda cagrılmasını istedigimiz bir fonksiyon yaratıyoruz

  editCategory(category: any) {
    //Form'da degişiklik yaparken yanlıslıkla orijinal listeyi degiştirmemek adına önce ayrı bir nesnede calısıcaz...Sadece Kaydet dedigimizde listeyi güncelleyecegiz
    this.selectedCategory.set({ ...category }); //nesneyi deconstruct edip tam yapısını ayrık bir şekilde ele geciriyoruz...
  }

  //Edit yaptıgımız zaman input'ta kategori adını degiştirdigimizde calısacak sistem
  onEditNameChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;

    this.selectedCategory.update((x) => {
      if (!x) return x; //x null ise hic dokunma
      return { ...x, categoryName: value };
    });
  }

  onEditDescriptionChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;

    this.selectedCategory.update((x) => {
      if (!x) return x;
      return { ...x, description: value };
    });
  }

  cancelEdit() {
    this.selectedCategory.set(null);
  }

  //Submit icin yarattıgımız fonksiyon
  async updateCategory(event: Event) {
    event.preventDefault();

    const cat = this.selectedCategory();
    if (!cat) return;

    const body = {
      id: cat.id,
      categoryName: cat.categoryName,
      description: cat.description,
    };

    try {
      const message = await lastValueFrom(
        this.http.put('http://localhost:5004/api/Category', body, {
          responseType: 'text',
        })
      );

      console.log("Update mesajı:",message);

      this.categories.set(await this.getCategories());

      //Secili kategoriyi tekrar null'a cekiyoruz
      this.selectedCategory.set(null);

    } catch (error) {
      console.log(error);
    }
  }
}
